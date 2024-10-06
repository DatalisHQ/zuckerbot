import { createResolver, defineNuxtModule, addImportsDir } from "nuxt/kit";

const mixpanelProviderPath = "./provider/mixpanel";
const gaProviderPath = "./provider/google";

export default defineNuxtModule({
  meta: {
    name: "analytics",
  },
  setup() {
    const { resolve } = createResolver(import.meta.url);
    addImportsDir(resolve(mixpanelProviderPath));
    addImportsDir(resolve(gaProviderPath));
  },
});
