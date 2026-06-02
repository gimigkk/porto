import { visit } from "unist-util-visit";

export default function rehypePreprocessMermaid() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'pre' && node.children?.length === 1 && node.children[0].tagName === 'code') {
        const codeNode = node.children[0];
        const className = codeNode.properties?.className || [];
        if (Array.isArray(className) && className.includes('language-mermaid')) {
          node.tagName = 'div';
          node.properties.className = ['language-mermaid'];
          const textNode = codeNode.children?.[0];
          if (textNode && textNode.type === 'text') {
            node.properties['data-chart'] = textNode.value;
          }
          node.children = [];
        }
      }
    });
  };
}
