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
    parser = new Parser(enc);

  parser.on('startElement', function _startElement(name, attrs) {
    var newNode = [ name ];
    if (!_isEmpty(attrs)) newNode.push(attrs);

    if (node) {
      node.push(newNode);
      nodeStack.push(node);
    }

    node = newNode;
  });

  parser.on('endElement', function _endElement(name) {
    if (nodeStack.length == 0) root = node;

    node = nodeStack.pop();
  });

  parser.on('text', function _text(text) {
    var textContent = (noStrip) ? text : text.replace(/[\r\n\t]*/, "");

    if (textContent.length > 0) node.push(textContent);
  });

  var data = (typeof content === 'buffer') ? content : new Buffer(content, enc);
  if (!parser.parse(data, true)) {
    throw new Error('Could not parse XML: ' + parser.getError());
  }

  return root;
}

/**
 * JsonML parser.
 */
module.exports.parse = _parse;
