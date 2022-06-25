import cookieParser from 'cookie-parser';
import express from 'express';
import 'module-alias/register';

import { userRouter } from './user/routes';

const app = express();
const port = process.env.PORT;

app.use(cookieParser());
app.use(express.json());

// ROUTER
app.use('/api/v1', userRouter);

const server = app.listen(port, () => {
	console.log(`Server is running at port ${port}`);
});

export { app, server };
