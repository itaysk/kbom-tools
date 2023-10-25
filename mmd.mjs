import { readFileSync } from "fs";

function skbomMmd(data) {
  // note to self: mermaid renderer dosn't like leading whitespace  
  return `---
title: ${data.name}:${data.version}
---
flowchart LR
  subgraph masters["Masters"]
    ${data.controlPlane.nodes.reduce((acc, n) => acc + printNode(n) + "\n", "")}
    end
  subgraph controlplane["Control Plane"]
    ${data.controlPlane.components.reduce((acc, r) => acc + printResource(r) + "\n", "")}
    end
  subgraph nodes["Workers"]
    ${data.nodes.reduce((acc, n) => acc + printNode(n) + "\n", "")}
    end
  subgraph components["Components"]
    ${data.components.reduce((acc, r) => acc+ printResource(r) + "\n", "")}
    end
  classDef node fill:Bisque
  classDef section stroke:MidnightBlue,fill:none
  classDef os fill:LightSteelBlue
  class masters,controlplane,nodes,components section
  class nodes nodes
`;
}

function printNode(n) {
    return `subgraph ${n.id}[${n.name}]
  ${n.resources.reduce((acc, r) => acc + "  " + printResource(r) + "\n", "")}
  ${n.id}-os{{"${n.os.name}:${n.os.version}"}}:::os
  end`;
}

function printResource(r) {
    let res = `${r.id}["${r.name}:${r.version}"]`;
    res += r.resources.reduce((acc, v) => acc+`\n${v.id}["${v.name}:${v.version}"]\n${r.id} --> ${v.id}`, "");
    return res;
}

(() => {
    const filePath = process.argv[2];
    let data;
    try {
        const text = readFileSync(filePath, 'utf8');
        data = JSON.parse(text);
    } catch (err) {
        console.error(err);
    }
    let mmd = skbomMmd(data);
    console.log(mmd);
})();