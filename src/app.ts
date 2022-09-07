import 'module-alias/register';

import app from './loaders/express';

const port = process.env.PORT;

const server = app.listen(port, () => {
	console.log(`Server is running at port ${port}`);
});

export { app, server };
