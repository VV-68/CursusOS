const React = require('react');

const flatten = (nodes) => {
  return React.Children.toArray(nodes).reduce((acc, node) => {
    if (node && node.type === React.Fragment) {
      return acc.concat(flatten(node.props.children));
    }
    return acc.concat(node);
  }, []);
};

const frag = React.createElement(React.Fragment, null, 
  React.createElement('div', { id: 1 }), 
  React.createElement('div', { id: 2 })
);

const children = [frag, React.createElement('span', { id: 3 })];
const flat = flatten(children);
console.log(flat.map(f => f.props.id));
