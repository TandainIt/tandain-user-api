import { validateBody } from '@/middleware/validate';
import { Router } from 'express';

import user from '../controller';

const router = Router();

router.post(
	'/user/login/google',
	validateBody(['code', 'redirectUri']),
	user.loginWithGoogle
);

export default router;
