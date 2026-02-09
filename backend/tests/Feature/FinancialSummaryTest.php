<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\Hotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinancialSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_overall_financial_summary_returns_200(): void
    {
        $response = $this->getJson('/api/financial-summary/overall?period=monthly');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'period',
                    'date_range' => ['start_date', 'end_date'],
                    'summary' => ['kitna_dena', 'kitna_lena', 'balance'],
                    'breakdown' => [
                        'dena' => ['employees', 'suppliers', 'total'],
                        'lena' => ['employees', 'suppliers', 'clients_pending', 'total'],
                    ],
                ],
            ])
            ->assertJson(['success' => true]);
    }

    public function test_employee_financial_summary_returns_200(): void
    {
        $response = $this->getJson('/api/employees/' . $this->user->id . '/financial-summary?period=monthly');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'employee' => ['id', 'name', 'email'],
                    'period',
                    'financial_summary' => ['profit', 'loss', 'dena', 'lena', 'summary'],
                ],
            ])
            ->assertJson(['success' => true]);
    }

    public function test_employee_financial_summary_validates_period(): void
    {
        $response = $this->getJson('/api/employees/' . $this->user->id . '/financial-summary');
        $response->assertStatus(422);
    }

    public function test_supplier_financial_summary_returns_200_when_supplier_exists(): void
    {
        $supplier = Supplier::create([
            'company_name' => 'Test Supplier',
            'first_name' => 'Test',
            'last_name' => 'Supplier',
        ]);
        $response = $this->getJson('/api/suppliers/' . $supplier->id . '/financial-summary?period=monthly');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'supplier' => ['id', 'name', 'company_name'],
                    'financial_summary' => ['revenue', 'cost', 'profit', 'loss'],
                ],
            ])
            ->assertJson(['success' => true]);
    }

    public function test_transfer_financial_summary_returns_200_when_transfer_exists(): void
    {
        $transfer = Transfer::create([
            'name' => 'Test Vehicle',
            'destination' => 'Manali',
        ]);
        $response = $this->getJson('/api/transfers/' . $transfer->id . '/financial-summary?period=monthly');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'vehicle' => ['id', 'name', 'destination'],
                    'financial_summary' => ['revenue', 'cost', 'profit', 'loss'],
                ],
            ])
            ->assertJson(['success' => true]);
    }

    public function test_hotel_financial_summary_returns_200_when_hotel_exists(): void
    {
        $hotel = Hotel::create([
            'name' => 'Test Hotel',
            'destination' => 'Manali',
            'hotel_address' => 'Test Address',
        ]);
        $response = $this->getJson('/api/hotels/' . $hotel->id . '/financial-summary?period=monthly');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'hotel' => ['id', 'name', 'destination'],
                    'financial_summary' => ['revenue', 'cost', 'profit', 'loss'],
                ],
            ])
            ->assertJson(['success' => true]);
    }
}
