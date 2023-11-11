import denoliver from "https://deno.land/x/denoliver@2.3.1/mod.ts"
import * as denopack from "https://deno.land/x/denopack@0.9.0/vendor/terser@5.3.0/terser.ts";
import { debounce } from "https://deno.land/std@0.194.0/async/debounce.ts";
import { parse } from "https://deno.land/std@0.202.0/yaml/mod.ts";
import { compress } from "./compress.js";


function getSafeObjectName(path: string) {

  const sep = path.split('.');
  const joined = sep.join('-');
  const withoutExt = joined.slice(0, -5); 
  return withoutExt;

}



function getExt(path: string) {

    const sep = path.split('.');
    const last = sep.pop() ?? '';
    return last.toLowerCase();

}


async function scan(path: string, fileContent: string[], fileName: string[], setError: (s: string) => void) {

  const dir = Deno.readDir(path);
  for await (const f of dir) {
    const fullpath = `${path}/${f.name}`;
    if (f.isFile) {
      if (getExt(fullpath) === 'yaml') {
        const yaml = await Deno.readTextFile(fullpath);
        try {
          // deno-lint-ignore no-explicit-any
          const object: any = parse(yaml);
          const s = `"${getSafeObjectName(f.name)}": ${JSON.stringify(object)}`;
          fileContent.push(s);
          fileName.push(fullpath);  
        } catch (e) {
          setError(`${e} \n\n in file: ${fullpath}`);
          return;
        }
      }
    } else if (f.isDirectory) {
      await scan(fullpath, fileContent, fileName, setError);
    }
  }

}


async function refreshset(setStory: (s: string) => void) {

    const fileName: string[] = [];

    const comp = await Deno.readTextFile('compress.js');
    const mark = await Deno.readTextFile('mark.js');
    const smart = await Deno.readTextFile('smartypants.js');
    const ng = await Deno.readTextFile('engine.js');
    let fileContent: string[] = [];
    const setError = (e: string) => {
      fileContent = [`err: \`${e}\``];
    }
    await scan('story', fileContent, fileName, setError);
    const story = `{${fileContent.join(',')}}`;
    const encodedStory = compress(story);
    const encoded = `const stl = \`${encodedStory}\`;`;
    const output = await denopack.minify(`${comp}${mark}${smart}${encoded}${ng}`, {
      mangle: true,
      compress: true,
      toplevel: true
    });
    if (output) {
      setStory(output.code ?? '');
    }

}


async function checksrc() {

    const watcher = Deno.watchFs("story");

    const ref = debounce((_event) => {
        refreshset(s => Deno.writeTextFile('./dist/adv.min.js', s));
    }, 200);

    for await (const event of watcher) {
       ref(event);
    }

}


export function run() {

    refreshset(s => Deno.writeTextFile('./dist/adv.min.js', s));
    checksrc();
    denoliver({ root: 'dist', port: 6060, cors: true });

}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  run();
}