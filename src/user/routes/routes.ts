import { Router } from 'express';

import user from '../controller';

const router = Router();

router.post('/user/login/google', user.loginWithGoogle);

export default router
