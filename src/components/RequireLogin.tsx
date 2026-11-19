import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLE_PREFIX, useAkses } from '../lib/akses';

export default function RequireLogin() {
    const { currentUser } = useAkses();
    const location = useLocation();

    if (!currentUser || currentUser.status !== 'Aktif') {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Salah awalan (mis. bendahara membuka /admin/kas), arahkan ke awalan miliknya
    const prefix = ROLE_PREFIX[currentUser.role];
    const { pathname } = location;
    if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
        const sisa = pathname.replace(/^\/[^/]+/, '');
        return <Navigate to={`${prefix}${sisa}`} replace />;
    }

    return <Outlet />;
}