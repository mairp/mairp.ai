// Worker in front of the static assets.
// - www.mairp.ai answers with a 301 to the apex, keeping path and query.
// - Every other request is served from the assets binding (dist/).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.mairp.ai') {
      url.hostname = 'mairp.ai';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
