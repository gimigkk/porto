import createMDX from "@next/mdx";

const mermaidPluginPath = new URL('./lib/rehype-mermaid.mjs', import.meta.url).pathname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    qualities: [75, 95],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      ["remark-gfm"]
    ],
    rehypePlugins: [
      [mermaidPluginPath],
      ["rehype-pretty-code", { theme: "github-dark", keepBackground: true }]
    ],
  },
});

export default withMDX(nextConfig);
