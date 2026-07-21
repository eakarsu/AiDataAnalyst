import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function claimsFromRequest(req, env) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!match) return null;
  return jwt.verify(match[1], env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithms: ['HS256'],
  });
}

export function createAuthRouter(pool, env = process.env) {
  const router = express.Router();
  router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'email_and_password_required' });
    const result = await pool.query(
      `SELECT u.id,u.email,u.password_hash,m.tenant_id,m.role
       FROM analyst_users u JOIN analyst_memberships m ON m.user_id=u.id
       WHERE lower(u.email)=lower($1) AND u.status='active' AND m.status='active'
       ORDER BY m.tenant_id LIMIT 1`,
      [email],
    );
    const user = result.rows[0];
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ sub: user.id, tenant_id: user.tenant_id, role: user.role }, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithm: 'HS256',
      expiresIn: '1h',
    });
    return res.json({ token, user: { id: user.id, email: user.email, tenantId: user.tenant_id, role: user.role } });
  });
  router.get('/me', async (req, res) => {
    try {
      const claims = claimsFromRequest(req, env);
      if (!claims?.sub || !claims?.tenant_id) return res.status(401).json({ error: 'invalid_token' });
      const result = await pool.query(
        `SELECT u.id,u.email,m.tenant_id,m.role FROM analyst_users u
         JOIN analyst_memberships m ON m.user_id=u.id
         WHERE u.id=$1 AND m.tenant_id=$2 AND u.status='active' AND m.status='active'`,
        [claims.sub, claims.tenant_id],
      );
      if (!result.rowCount) return res.status(401).json({ error: 'identity_not_active' });
      const user = result.rows[0];
      return res.json({ id: user.id, email: user.email, tenantId: user.tenant_id, role: user.role });
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  });
  return router;
}

export async function provisionTestIdentity(pool, env = process.env) {
  if (env.NODE_ENV !== 'test') return;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) throw new Error('Explicit strong test admin credentials are required');
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const tenant = await pool.query("INSERT INTO analyst_tenants(name,status) VALUES($1,'active') RETURNING id", ['Runtime Acceptance Tenant']);
  const user = await pool.query(
    `INSERT INTO analyst_users(email,status,password_hash) VALUES($1,'active',$2)
     ON CONFLICT(email) DO UPDATE SET status='active',password_hash=EXCLUDED.password_hash RETURNING id`,
    [env.ADMIN_EMAIL, passwordHash],
  );
  await pool.query(
    `INSERT INTO analyst_memberships(tenant_id,user_id,role,groups,permissions,status)
     VALUES($1,$2,'owner','[]'::jsonb,'[]'::jsonb,'active')
     ON CONFLICT(tenant_id,user_id) DO UPDATE SET role='owner',status='active'`,
    [tenant.rows[0].id, user.rows[0].id],
  );
}
