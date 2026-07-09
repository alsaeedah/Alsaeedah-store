
-- 1. السماح للمشرف برؤية جميع المستخدمين
-- استبدل الإيميل بإيميل المشرف الخاص بك إذا كان مختلفاً
DROP POLICY IF EXISTS "Allow admin read all" ON public.users;
CREATE POLICY "Allow admin read all" 
ON public.users 
FOR SELECT 
USING (
  auth.email() = 'timetick711@gmail.com' OR 
  auth.email() = 'saeedbinmeslem@gmail.com'
);

-- 2. السماح للمشرف بحذف أي مستخدم
DROP POLICY IF EXISTS "Allow admin delete any" ON public.users;
CREATE POLICY "Allow admin delete any" 
ON public.users 
FOR DELETE 
USING (
  auth.email() = 'timetick711@gmail.com' OR 
  auth.email() = 'saeedbinmeslem@gmail.com'
);

-- 3. التأكد من أن المستخدم العادي يمكنه رؤية وتعديل بياناته فقط
DROP POLICY IF EXISTS "Allow individual selection" ON public.users;
CREATE POLICY "Allow individual selection" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual insert" ON public.users;
CREATE POLICY "Allow individual insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual update" ON public.users;
CREATE POLICY "Allow individual update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. سياسة للأوامر (Orders) لضمان ظهورها في الداشبورد
DROP POLICY IF EXISTS "Allow admin read all orders" ON public.orders;
CREATE POLICY "Allow admin read all orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.email() = 'timetick711@gmail.com' OR 
  auth.email() = 'saeedbinmeslem@gmail.com'
);

DROP POLICY IF EXISTS "Allow admin full access to orders" ON public.orders;
CREATE POLICY "Allow admin full access to orders" 
ON public.orders 
FOR ALL 
USING (
  auth.email() = 'timetick711@gmail.com' OR 
  auth.email() = 'saeedbinmeslem@gmail.com'
);
