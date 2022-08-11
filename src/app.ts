import express from 'express';
import 'module-alias/register';
import swaggerUI from 'swagger-ui-express';
import * as swaggerDocument from '../swagger.json';

import { authRouter } from './auth/controller';

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.set('trust proxy', true);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.get('/api-docs.json', (_, res) => res.json(swaggerDocument));

// ROUTER
app.use('/api/v1', authRouter);

const server = app.listen(port, () => {
	console.log(`Server is running at port ${port}`);
});

export { app, server };
