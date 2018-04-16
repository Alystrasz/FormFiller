var result = jsyaml.load('greeting: hello\n#Ceci est un commentaire\nname: world');

var obj = {
    a: 1,

    // this is a comment
    b: 4,
    c: function () {
        // this is a comment
        console.log('cc');
    }
}
var result2 = jsyaml.dump(obj);


// YAML -> JSON : delete comments [OK]
// JSON does not accept comments
// TODO check lib options to keep comments while going to YAML
