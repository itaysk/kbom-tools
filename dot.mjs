import { readFileSync } from "fs";

function skbomDot(data) {
    return `
digraph cluster{
  rankdir="LR";
  label="${data.name}:${data.version}";
  node[shape="box";style="filled,solid";color=mediumpurple;fillcolor=bisque];
  subgraph masters {
    cluster=true;
    label="Masters";
    style="solid";
    ${data.controlPlane.nodes.reduce((acc, n) => acc + printNode(n) + "\n", "")}
  }
  subgraph controlplane {
    cluster=true;
    label="Control Plane";
    style="solid";
    ${data.controlPlane.components.reduce((acc, r) => acc + printResource(r) + "\n", "")}
  }
  subgraph nodes {
    cluster=true;
    label="Workers";
    style="solid";
    ${data.nodes.reduce((acc, n) => acc + printNode(n) + "\n", "")}
  }
  subgraph components {
    cluster=true;
    label="Componenets";
    style="solid";
    ${data.components.reduce((acc, r) => acc+ printResource(r) + "\n", "")}
  }
}`;
}

function printNode(n) {
    return `subgraph "${n.id}" {
      cluster=true;
      label="${n.name}";
      style="filled,solid";
      color=olive;
      fillcolor=lightyellow;
  ${n.resources.reduce((acc, r) => acc + "  " + printResource(r) + "\n", "")}
  ${n.id}_os[label="${n.os.name}:${n.os.version}"; style="filled,solid"; color="mediumpurple"; fillcolor="LightSteelBlue"; shape="hexagon"]
  }`;
}

function printResource(r) {
    let res = `${r.id}[label="${r.name}:${r.version}"]`;
    res += r.resources.reduce((acc, v) => acc+`\n${v.id}[label="${v.name}:${v.version}"]\n${r.id} -> ${v.id}`, "");
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
    let mmd = skbomDot(data);
    console.log(mmd);
})();