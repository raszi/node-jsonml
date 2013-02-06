var
  vows   = require('vows'),
  assert = require('assert'),
  fs     = require('fs'),
  path   = require('path'),

  jsonmlLib = require('../lib/jsonml.js'),
  parse  = jsonmlLib.parse;
  toXML = jsonmlLib.toXML;

var
  simpleXHTMLData = [ "ul",
    [ "li", { "style" : "color:red" }, "First Item" ],
    [ "li", { "title" : "Some hover text.", "style" : "color:green" }, "Second Item" ],
    [ "li", [ "span", { "class" : "code-example-third" }, "Third" ], " Item" ]
  ],

  complicatedXHTMLData = [ "table", { "class" : "MyTable", "style" : "background-color:yellow" },
    [ "tr",
      [ "td", { "class" : "MyTD", "style" : "border:1px solid black" }, "#5D28D1" ],
      [ "td", { "class" : "MyTD", "style" : "background-color:red" }, "Example text here" ]
    ],
    [ "tr",
      [ "td", { "class" : "MyTD", "style" : "border:1px solid black" }, "#AF44EF" ],
      [ "td", { "class" : "MyTD", "style" : "background-color:green" }, "127310656" ]
    ],
    [ "tr",
      [ "td", { "class" : "MyTD", "style" : "border:1px solid black" }, "#AAD034" ],
      [ "td", { "class" : "MyTD", "style" : "background-color:blue" }, "\u00A0",
        ["span", { "style" : "background-color:maroon" }, "\u00A9" ],
        "\u00A0"
      ]
    ],
    [ "tr",
      [ "td", { "class" : "MyTD", "style" : "border:1px solid black" }, "#F00BA5" ],
      [ "td", { "class" : "MyTD", "style" : "background-color:cyan" }, "foo&bar" ]
    ]
  ];

function _testXHTML(filename, data) {
  return {
    'when reading a file first': {
      topic: function() {
        fs.readFile(path.join(__dirname, filename), this.callback);
      },

      'should read it without error': assert.isNull,

      'should parse it without error': function (err, data) {
        assert.doesNotThrow(function() {
          parse(data);
        }, Error);
      },

      'then parsing the data': {
        topic: function(data) {
          return parse(data.toString());
        },

        'should be valid': function(jsonml) {
          assert.deepEqual(jsonml, data);
        }
      }
    }
  };
}

//for comparison while testing: removes extra space, comments, etc.
function _normalizeXML(xml){
  var normal;
  normal = xml.toString();
  normal = normal
            .replace(/<![^>]*>\s*/g, '')  // comments, doctypes
            .replace(/<\?[^>]*>\s*/g, '') // <? ... >
            .replace(/>\s+/g, '>')        // space after tag
            .replace(/\s+</g, '<')        // space before tag
            .replace(/[\r\n\t]+/g, '');   // linebreaks, tabs
  return normal;
}

function _testToXML(jsonml, xmlFile) {
  return {
    'when testing toXML': {
      'the xml from the file': {
        topic: function(){
          fs.readFile(path.join(__dirname, xmlFile), this.callback);
        },
        
        'should read in without error': assert.isNull,
          
        'should match xml generated from jsonml': function(err, xml){
          assert.equal(_normalizeXML(toXML(jsonml)),
                       _normalizeXML(xml));
        }
      }
    }
  };
}

function _testInverseJSONML(jsonml){
  return {
    'when converting jsonml to xml and back': {
      'parse(toXML(input))': {
        topic: parse(toXML(jsonml)),
        
        'should equal the input': function(parsed){
          assert.deepEqual(parsed, jsonml);
        }
      }
    }
  };
}

function _testInverseXML(xmlFile){
  return {
    'when converting xml to jsonml and back': {
      'the xml from the file': {
        topic: function(){
          fs.readFile(path.join(__dirname, xmlFile), this.callback);
        },
        
        'should read in without error': assert.isNull,
        
        'should (when normalized) match toXML(parse(input))': function(xml){
          assert.equal(_normalizeXML(xml.toString()),
                       _normalizeXML(toXML(parse(xml.toString()))));
        }
      }
    }
  };
}

vows.describe('Simple test')
  .addBatch(_testXHTML('simple-snippet.xhtml', simpleXHTMLData))
  .addBatch(_testXHTML('complicated-snippet.xhtml', complicatedXHTMLData))
  .addBatch(_testToXML(simpleXHTMLData, 'simple-snippet.xhtml'))
  .addBatch(_testToXML(complicatedXHTMLData, 'complicated-snippet.xhtml'))
  .addBatch(_testInverseJSONML(simpleXHTMLData))
  .addBatch(_testInverseJSONML(complicatedXHTMLData))
  .addBatch(_testInverseXML('simple-snippet.xhtml'))
  .addBatch(_testInverseXML('complicated-snippet.xhtml'))
  .addBatch(_testInverseXML('large-file.xml'))
  .export(module);
