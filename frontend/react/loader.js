// Tiny in-browser JSX loader. This project has no bundler/build step, so instead of a
// webpack/vite pipeline we fetch each .jsx source file as text, transform it with
// @babel/standalone (loaded via CDN in the page <head>), and execute the compiled
// output as a real <script> tag. Files are loaded strictly in the order given, so a
// component can reference an already-loaded one (e.g. Sidebar.jsx uses RX.NavMenu)
// the same way plain <script> tags depend on load order.
window.RX = window.RX || {};

RX.loadComponents = async function loadComponents(paths) {
    for (const path of paths) {
        const res = await fetch(path);
        if (!res.ok) {
            throw new Error(`Failed to load React component source: ${path} (${res.status})`);
        }
        const source = await res.text();
        const { code } = Babel.transform(source, { presets: ['react'], filename: path });
        const script = document.createElement('script');
        script.text = code;
        document.body.appendChild(script);
    }
};
