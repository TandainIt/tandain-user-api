import express from 'express';
import swaggerUI from 'swagger-ui-express';
import * as swaggerDocument from '../../../swagger.json';

import { authRouter } from '@/auth/controller';
import { userRouter } from '@/user/controller';

const app = express();

app.use(express.json());
app.set('trust proxy', true);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.get('/api-docs.json', (_, res) => res.json(swaggerDocument));

// ROUTER
app.use('/api/v1', authRouter);
app.use('/api/v1', userRouter);

export default app;
