import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    Shield,
    Settings as SettingsIcon,
    Package
} from 'lucide-react';

export const ADMIN_MODULES = [
    { id: 'home', path: '/', label: 'الرئيسية', icon: LayoutDashboard, permission: 'all', order: 1 },
    { id: 'products', path: '/products', label: 'المنتجات', icon: ShoppingBag, permission: 'products', order: 2 },
    { id: 'inventory', path: '/inventory', label: 'المخزون', icon: Package, permission: 'products', order: 2.5 },
    { id: 'orders', path: '/orders', label: 'الطلبات', icon: ShoppingCart, badge: true, permission: 'orders', order: 3 },
    { id: 'users', path: '/users', label: 'المستخدمين', icon: Users, permission: 'users', order: 4 },
    { id: 'managers', path: '/managers', label: 'المدراء', icon: Shield, permission: 'all', order: 5 },
    { id: 'settings', path: '/settings', label: 'الإعدادات', icon: SettingsIcon, permission: 'all', order: 6 }
];

export const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;
    if (userPermissions.includes('all')) return true;
    return userPermissions.includes(requiredPermission);
};

export const getFirstAuthorizedRoute = (userPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) return '/unauthorized';
    
    // Sort modules by order to respect priority (Home -> Products -> Orders -> Users -> ...)
    const sortedModules = [...ADMIN_MODULES].sort((a, b) => a.order - b.order);
    
    for (const module of sortedModules) {
        if (hasPermission(userPermissions, module.permission)) {
            return module.path;
        }
    }
    
    return '/unauthorized';
};
