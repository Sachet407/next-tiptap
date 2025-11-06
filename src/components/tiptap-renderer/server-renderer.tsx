import { components } from "./components/custom";
import { createProcessor } from "./utils/processor";

interface TiptapRendererProps {
  children: string;
}

const TiptapRenderer = async({ children }: TiptapRendererProps) => {
  const processor = createProcessor({ components });
  const processed = await processor.processSync(children);
  return processed.result;
};

export default TiptapRenderer;
