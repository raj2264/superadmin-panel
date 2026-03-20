-- Early Settlement Requests table
-- Allows society admins to request early settlement of their Razorpay payments
CREATE TABLE IF NOT EXISTS early_settlement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    settlement_id UUID REFERENCES payment_settlements(id) ON DELETE SET NULL,  -- Optional link to settlement
    month_year DATE NOT NULL,                              -- Month for which early settlement is requested
    requested_amount DECIMAL(12,2) NOT NULL DEFAULT 0,     -- Amount to be settled early
    reason TEXT,                                            -- Reason for early settlement
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    requested_by UUID REFERENCES auth.users(id),           -- Admin who requested
    reviewed_by UUID REFERENCES auth.users(id),            -- Superadmin who reviewed
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,                                       -- Notes from superadmin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_settlement_requests_society ON early_settlement_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_early_settlement_requests_status ON early_settlement_requests(status);
CREATE INDEX IF NOT EXISTS idx_early_settlement_requests_month ON early_settlement_requests(month_year);

-- RLS
ALTER TABLE early_settlement_requests ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "Superadmins full access on early_settlement_requests"
    ON early_settlement_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM superadmins WHERE id = auth.uid())
    );

-- Society admins can view and insert their own requests
CREATE POLICY "Society admins can view own early settlement requests"
    ON early_settlement_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM society_admins
            WHERE society_admins.user_id = auth.uid()
              AND society_admins.society_id = early_settlement_requests.society_id
        )
    );

CREATE POLICY "Society admins can create own early settlement requests"
    ON early_settlement_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM society_admins
            WHERE society_admins.user_id = auth.uid()
              AND society_admins.society_id = early_settlement_requests.society_id
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_early_settlement_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_early_settlement_requests_updated_at
    BEFORE UPDATE ON early_settlement_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_early_settlement_requests_updated_at();
