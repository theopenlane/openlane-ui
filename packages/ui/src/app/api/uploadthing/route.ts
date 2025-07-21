import { createRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from 'src/uploadthing';

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
