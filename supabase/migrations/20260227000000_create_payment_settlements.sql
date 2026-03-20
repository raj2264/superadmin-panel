-- Payment Settlements table
-- Tracks monthly Razorpay settlement for each society
CREATE TABLE IF NOT EXISTS payment_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    month_year DATE NOT NULL,                            -- First day of the month, e.g. 2026-02-01
    razorpay_total DECIMAL(12,2) NOT NULL DEFAULT 0,     -- Total collected via Razorpay that month
    settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Amount to settle (after fees/deductions)
    platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,       -- Platform/processing fee deducted
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'settled', 'disputed')),
    settled_at TIMESTAMP WITH TIME ZONE,
    settlement_reference TEXT,                            -- Bank UTR / reference number
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(society_id, month_year)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_settlements_society ON payment_settlements(society_id);
CREATE INDEX IF NOT EXISTS idx_payment_settlements_status ON payment_settlements(status);
CREATE INDEX IF NOT EXISTS idx_payment_settlements_month ON payment_settlements(month_year);

-- RLS
ALTER TABLE payment_settlements ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "Superadmins full access on payment_settlements"
    ON payment_settlements FOR ALL
    USING (
        EXISTS (SELECT 1 FROM superadmins WHERE id = auth.uid())
    );

-- Society admins can view their own settlements
CREATE POLICY "Society admins can view own settlements"
    ON payment_settlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM society_admins
            WHERE society_admins.user_id = auth.uid()
              AND society_admins.society_id = payment_settlements.society_id
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_settlements_updated_at
    BEFORE UPDATE ON payment_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_settlements_updated_at();
