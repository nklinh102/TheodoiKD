-- Migration: Tạo bảng sop_data để lưu trữ dữ liệu SOP của đại lý
-- Chạy script này trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.sop_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_code TEXT NOT NULL,
    data JSONB NOT NULL, -- Lưu trữ toàn bộ dữ liệu từ Excel dưới dạng JSON
    upload_date DATE, -- Ngày dữ liệu này đại diện (có thể extract từ tên file hoặc người dùng nhập)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index cho agent_code để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_sop_data_agent_code ON public.sop_data(agent_code);

-- Tạo index cho upload_date để lọc theo ngày
CREATE INDEX IF NOT EXISTS idx_sop_data_upload_date ON public.sop_data(upload_date);

-- Tạo unique constraint để tránh trùng lặp agent_code trong cùng một upload_date
-- Nếu upload lại cùng ngày thì sẽ update thay vì tạo mới
CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_data_agent_upload ON public.sop_data(agent_code, upload_date);

-- Bật Row Level Security
ALTER TABLE public.sop_data ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép truy cập (tạm thời cho phép tất cả, có thể điều chỉnh sau)
CREATE POLICY "Cho phép truy cập đầy đủ" ON public.sop_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_sop_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động cập nhật updated_at khi có thay đổi
DROP TRIGGER IF EXISTS trigger_update_sop_data_updated_at ON public.sop_data;
CREATE TRIGGER trigger_update_sop_data_updated_at
    BEFORE UPDATE ON public.sop_data
    FOR EACH ROW
    EXECUTE FUNCTION update_sop_data_updated_at();
