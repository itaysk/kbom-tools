import { readFileSync } from "fs";
import { createHash } from "crypto";

var data;
var used = [];

// convert CycloneDX KBOM into skbom
function cdxToSkbom(cdxText) {
    data = JSON.parse(cdxText);
    const controlPlaneNodes = data.components.filter((c) => c.type == "platform" && propValue(c, "aquasecurity:trivy:NodeRole") == "master");
    const controlPlaneComponents = data.components.filter((c) => propValue(c, "aquasecurity:trivy:resource:Type") == "controlPlane");
    const nodes = data.components.filter((c) => c.type == "platform" && propValue(c, "aquasecurity:trivy:NodeRole") == "worker");
    let res = {
        id: sanitizeId(data.metadata.component["bom-ref"]),
        name: data.metadata.component.name,
        version: data.metadata.component.version,
        controlPlane: {
            nodes: controlPlaneNodes.map(mapNode),
            components: controlPlaneComponents.map(mapComponent)
        },
        nodes: nodes.map(mapNode),
    };
    const components = data.components.filter((c) => c.type == "application" && !used.some((u) => u == c["bom-ref"]));
    res.components = components.map(mapComponent);
    return res;
}

function mapComponent(c) {
    used.push(c["bom-ref"]);
    return {
        id: sanitizeId(c["bom-ref"]),
        name: c.name,
        version: c.version,
        resources: dependenciesOf(c["bom-ref"]).map((d)=>{
            used.push(d["bom-ref"]);
            return mapComponent(d);
        })
    };
}

function mapNode(c) {
    used.push(c["bom-ref"]);
    let os = dependenciesOf(c["bom-ref"]).find((d) => d.type == "operating-system");
    used.push(os["bom-ref"]);
    let ncc = dependenciesOf(c["bom-ref"]).find((d) => d.name == "node-core-components");
    used.push(ncc["bom-ref"]);
    let cc = dependenciesOf(ncc["bom-ref"]);
    return {
        id: sanitizeId(c["bom-ref"]),
        name: c.name,
        os: {
            name: os.name,
            version: os.version,
            kernelVersion: propValue(c, "aquasecurity:trivy:KernelVersion"),
        },
        resources: cc.map((cc)=> {
            used.push(cc["bom-ref"]);
            return mapComponent(cc);
        })
    }
}

function dependenciesOf(id) {
    return data.dependencies.find((d) => d.ref == id).dependsOn.flatMap((d) => {
        return data.components.filter((c) => c["bom-ref"] == d);
    });
}

function propValue(c, name) {
    return c.properties?.find((p) => p.name == name)?.value || null;
}

// CycloneDX's bom-ref can be any string. Since it's likely to be used as ID, we need to sanitize it.
// 1. Create a hash of the bom-ref
// 2. Prefix it with "id" (strings starting with a number might be interpreted as numbers)
let ids = {};
function sanitizeId(id) {
    if (ids[id]) {
        return ids[id];
    } else {
        ids[id] = "id" + createHash('sha1').update(id).digest('hex');
        return ids[id];
    }
}

export {
    cdxToSkbom
}

(() => {
    const filePath = process.argv[2];
    let text;
    try {
        text = readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(err);
    }
    let res = cdxToSkbom(text);
    console.log(JSON.stringify(res, null, 4));
})();

