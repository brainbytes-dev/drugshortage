import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  // Options for MDX processing
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default withMDX(nextConfig);
