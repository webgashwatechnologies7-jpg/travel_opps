<?php

namespace App\Modules\Leads\Domain\Entities;

use App\Models\User;
use App\Models\QueryProposal;
use App\Models\QueryFollowup;
use App\Models\QueryDocument;
use App\Models\QueryHistoryLog;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use App\Modules\Leads\Domain\Entities\LeadStatusLog;
use App\Modules\Payments\Domain\Entities\Payment;
use App\Modules\Proposals\Domain\Models\Proposal;
use App\Modules\Mails\Domain\Models\Email;
use App\Modules\SupplierCommunication\Domain\Models\SupplierCommunication;
use App\Modules\PostSales\Domain\Models\PostSale;
use App\Modules\Vouchers\Domain\Models\Voucher;
use App\Modules\Documents\Domain\Models\Document;
use App\Modules\Invoices\Domain\Models\Invoice;
use App\Modules\Billing\Domain\Models\BillingRecord;
use App\Modules\History\Domain\Models\ActivityHistory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'leads';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'client_name',
        'client_title',
        'email',
        'phone',
        'source',
        'destination',
        'status',
        'assigned_to',
        'priority',
        'created_by',
        'travel_start_date',
        'travel_end_date',
        'adult',
        'child',
        'infant',
        'budget',
        'remark',
        'query_id'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'status' => 'string',
        'priority' => 'string',
        'travel_start_date' => 'date',
        'travel_end_date' => 'date',
        'adult' => 'integer',
        'child' => 'integer',
        'infant' => 'integer',
        'budget' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user assigned to this lead.
     *
     * @return BelongsTo
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created this lead.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Alias for creator relationship
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all followups for this lead.
     *
     * @return HasMany
     */
    public function followups(): HasMany
    {
        return $this->hasMany(LeadFollowup::class, 'lead_id');
    }

    /**
     * Get all status logs for this lead.
     *
     * @return HasMany
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(LeadStatusLog::class, 'lead_id');
    }

    /**
     * Get all payments for this lead.
     *
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'lead_id');
    }

    /**
     * Get all proposals for this lead.
     *
     * @return HasMany
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'lead_id');
    }

    /**
     * Get all query proposals for this lead.
     *
     * @return HasMany
     */
    public function queryProposals(): HasMany
    {
        return $this->hasMany(QueryProposal::class, 'lead_id');
    }

    /**
     * Get all query followups for this lead.
     *
     * @return HasMany
     */
    public function queryFollowups(): HasMany
    {
        return $this->hasMany(QueryFollowup::class, 'lead_id');
    }

    /**
     * Get all emails for this lead.
     *
     * @return HasMany
     */
    public function emails(): HasMany
    {
        return $this->hasMany(Email::class, 'lead_id');
    }

    /**
     * Get all supplier communications for this lead.
     *
     * @return HasMany
     */
    public function supplierCommunications(): HasMany
    {
        return $this->hasMany(SupplierCommunication::class, 'lead_id');
    }

    /**
     * Get all post sales activities for this lead.
     *
     * @return HasMany
     */
    public function postSales(): HasMany
    {
        return $this->hasMany(PostSale::class, 'lead_id');
    }

    /**
     * Get all vouchers for this lead.
     *
     * @return HasMany
     */
    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class, 'lead_id');
    }

    /**
     * Get all documents for this lead.
     *
     * @return HasMany
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'lead_id');
    }

    /**
     * Get all query documents for this lead.
     *
     * @return HasMany
     */
    public function queryDocuments(): HasMany
    {
        return $this->hasMany(QueryDocument::class, 'lead_id');
    }

    /**
     * Get all invoices for this lead.
     *
     * @return HasMany
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'lead_id');
    }

    /**
     * Get all billing records for this lead.
     *
     * @return HasMany
     */
    public function billingRecords(): HasMany
    {
        return $this->hasMany(BillingRecord::class, 'lead_id');
    }

    /**
     * Get all activity histories for this lead.
     *
     * @return HasMany
     */
    public function activityHistories(): HasMany
    {
        return $this->hasMany(ActivityHistory::class, 'lead_id');
    }

    /**
     * Get all query history logs for this lead.
     *
     * @return HasMany
     */
    public function queryHistoryLogs(): HasMany
    {
        return $this->hasMany(QueryHistoryLog::class, 'lead_id');
    }
}

