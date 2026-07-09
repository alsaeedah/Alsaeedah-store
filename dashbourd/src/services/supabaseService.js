
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase/client';

const DEFAULT_TIMEOUT = 10000;

/**
 * دالة موحدة لجلب البيانات مع مهلة زمنية (Timeout) وخيار التبديل للـ REST API المباشر
 * @param {Object} query - استعلام supabase
 * @param {String} tableName - اسم الجدول (للفلبات)
 * @param {Number} timeoutMs - مهلة الوقت بالملي ثانية
 */
export const fetchWithTimeout = async (query, tableName, timeoutMs = DEFAULT_TIMEOUT) => {
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SUPABASE_CLIENT_HANG')), timeoutMs)
        );
        
        // Ensure we are racing with a real promise (supabase builders are thenables)
        const { data, error, count } = await Promise.race([
            Promise.resolve(query), 
            timeoutPromise
        ]);

        if (error) throw error;
        return { data, count, error: null };
    } catch (error) {
        console.error(`[supabaseService] Error fetching from ${tableName}:`, error.message);

        // إذا علق العميل أو كان هناك خطأ في الاتصال، نحاول الجلب المباشر
        if (error.message === 'SUPABASE_CLIENT_HANG' || error.message.includes('fetch')) {
            console.warn(`[supabaseService] Falling back to direct REST fetch for ${tableName}...`);
            try {
                // محاولة الاتصال بـ REST API الخاص بـ Supabase مباشرة
                const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*`, {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${supabaseAnonKey}`
                    }
                });
                if (!response.ok) throw new Error('REST_API_FAILED');
                const data = await response.json();
                return { data, count: data.length, error: null };
            } catch (fallbackErr) {
                console.error(`[supabaseService] Fallback also failed:`, fallbackErr.message);
            }
        }

        return { data: [], count: 0, error: error.message };
    }
};

/**
 * جلب المستخدمين مع دعم البحث والصفحات
 */
export const fetchUsersPaging = async (page = 0, pageSize = 12, searchQuery = '') => {
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,store_owner_info.ilike.%${searchQuery}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const result = await fetchWithTimeout(query.range(from, to), 'users');
    return result;
};

/**
 * جلب الطلبات مع دعم البحث والصفحات
 */
export const fetchOrdersPaging = async (page = 0, pageSize = 6, filters = {}) => {
    let query = supabase.from('orders').select('*, users(name, phone)', { count: 'exact' });

    if (filters.searchQuery) {
        const isUUID = filters.searchQuery.length === 36 && /^[0-9a-f-]+$/i.test(filters.searchQuery);
        if (isUUID) {
            query = query.eq('id', filters.searchQuery);
        } else {
            query = query.or(`customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%`);
        }
    }

    const status = filters.statusFilter || filters.status;
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const from = page * pageSize;
    const to = from + pageSize - 1;

    let result = await fetchWithTimeout(query.range(from, to), 'orders');

    // If join fails, fall back to orders without user join
    if (result.error && (result.error.includes('relationship') || result.error.includes('users'))) {
        console.warn('[supabaseService] Retrying orders fetch without users join...');
        let fallbackQuery = supabase.from('orders').select('*', { count: 'exact' });
        if (filters.searchQuery) {
            const isUUID = filters.searchQuery.length === 36 && /^[0-9a-f-]+$/i.test(filters.searchQuery);
            if (isUUID) {
                fallbackQuery = fallbackQuery.eq('id', filters.searchQuery);
            } else {
                fallbackQuery = fallbackQuery.or(`customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%`);
            }
        }
        const statusFallback = filters.statusFilter || filters.status;
        if (statusFallback && statusFallback !== 'all') {
            fallbackQuery = fallbackQuery.eq('status', statusFallback);
        }
        fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        result = await fetchWithTimeout(fallbackQuery.range(from, to), 'orders');
    }

    return result;
};
