var
  buffer = require('buffer'),
  Parser = require('node-expat').Parser;

function _isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }

  return true;
}

function _parse(content, encoding, noStripWhiteSpace) {
  var
    enc = encoding || 'UTF-8',
    noStrip = noStripWhiteSpace || false,

    nodeStack = [],
    root,
    node,
    partial = '',
    parser = new Parser(enc);

  parser.on('startElement', function _startElement(name, attrs) {
    var newNode = [ name ];

    if (partial) {
      node.push(partial);
      partial = '';
    }

    if (!_isEmpty(attrs)) newNode.push(attrs);

    if (node) {
      node.push(newNode);
      nodeStack.push(node);
    }

    node = newNode;
  });

  parser.on('endElement', function _endElement(name) {
    if (partial) {
      node.push(partial);
      partial = '';
    }

    if (nodeStack.length == 0) root = node;

    node = nodeStack.pop();
  });

  parser.on('text', function _text(text) {
    var textContent = (noStrip) ? text : text.replace(/[\r\n\t]*/, "");
    if (textContent.length > 0) {
      if (partial) {
        partial += textContent;
      } else {
        partial = textContent;
      }
    }
  });

  var data = (typeof content === 'buffer') ? content : new Buffer(content, enc);
  if (!parser.parse(data, true)) {
    throw new Error('Could not parse XML: ' + parser.getError());
  }

  return root;
}

function _escape(str){
  str = str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/&/g, '&amp;');
  return str;
}

function _toXML(arr){
  // crockford's basic algorithm from his java jsonml lib
  // github.com/douglascrockford/JSON-java/blob/master/JSONML.java

  var
    xml = '',
    tagname = arr[0],
    obj = arr[1],
    i = 0,
    next;
  
  // open tag
  if(tagname.match(/[ \t]/)){
    throw new Error('tagname cannot contain whitespace');
  }
  tagname = _escape(tagname);
  xml += ('<' + tagname);
  
  //add attributes, if any
  obj = arr[1];
  if((typeof obj === 'object') && (!(obj instanceof Array))){
    i = 2;
    for(var key in obj){
      xml += (' ' + key + '="' + obj[key] + '"');
    }
  }
  else{
    i = 1;
  }
  
  //add content, if any
  if(i >= arr.length){
    xml += '/>';
  }
  else{
    xml += '>';
    
    while(i < arr.length){
      next = arr[i];
      if(next){
        if(typeof next === 'string'){
          xml += _escape(next);
        }
        else if(next instanceof Array){
          xml += _toXML(next);
        }
      }
      
      i++;
    }
    
    //close tag
    xml += ('</' + tagname + '>');
  }
  
  return xml;
}

/**
 * JsonML parser and toXML.
 */
module.exports.parse = _parse;
module.exports.toXML = _toXML;
