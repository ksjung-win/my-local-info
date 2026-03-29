fetch('https://infos-info.com/blog/2026-03-29-earned-child-grant/')
  .then(r => r.text())
  .then(t => {
    if (t.includes('혹시 나도')) {
      console.log('SUCCESS: Page content found');
    } else if (t.includes('This page could not be found')) {
      console.log('ERROR: Next.js 404 page');
    } else {
      console.log('UNKNOWN');
      console.log(t.slice(0, 500));
    }
  })
  .catch(e => console.error(e));
