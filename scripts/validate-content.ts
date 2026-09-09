import { validateContent } from "../src/lib/content";
const result = validateContent();
console.log(`Validated ${result.scaleCount} scales and ${result.topicCount} topics.`);
