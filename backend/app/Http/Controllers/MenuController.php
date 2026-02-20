<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /**
     * Default sidebar menu structure (icon = Lucide icon name string for frontend mapping).
     * Includes WhatsApp Integration & Email Integration under Settings for company admin flow.
     */
    public static function getDefaultMenu(): array
    {
        return [
            ['path' => '/dashboard', 'label' => 'Dashboard', 'icon' => 'LayoutDashboard'],
            ['path' => '/notifications', 'label' => 'Notifications', 'icon' => 'Bell'],
            ['path' => '/leads', 'label' => 'Queries', 'icon' => 'MessageSquare'],
            ['path' => '/itineraries', 'label' => 'Itineraries', 'icon' => 'FileText'],
            ['path' => '/payments', 'label' => 'Payments', 'icon' => 'CreditCard'],
            ['path' => '/sales-reps', 'label' => 'Sales Reps', 'icon' => 'Users'],
            [
                'label' => 'Accounts',
                'icon' => 'CreditCard',
                'submenu' => [
                    ['path' => '/accounts/clients', 'label' => 'Clients'],
                    ['path' => '/accounts/agents', 'label' => 'Agents'],
                    ['path' => '/accounts/corporate', 'label' => 'Corporate'],
                ],
            ],
            ['path' => '/whatsapp', 'label' => 'WhatsApp', 'icon' => 'MessageCircle'],
            ['path' => '/mail', 'label' => 'Mail', 'icon' => 'Mail'],
            ['path' => '/call-management', 'label' => 'Call Management System', 'icon' => 'Phone'],
            ['path' => '/followups', 'label' => 'Followups', 'icon' => 'ClipboardList'],
            [
                'label' => 'Reports',
                'icon' => 'BarChart3',
                'submenu' => [
                    ['path' => '/dashboard/employee-performance', 'label' => 'Performance'],
                    ['path' => '/dashboard/source-roi', 'label' => 'Source ROI'],
                    ['path' => '/dashboard/destination-performance', 'label' => 'Destination'],
                ],
            ],
            [
                'label' => 'Marketing',
                'icon' => 'Megaphone',
                'submenu' => [
                    ['path' => '/marketing', 'label' => 'Dashboard'],
                    ['path' => '/client-groups', 'label' => 'Clients Group'],
                    ['path' => '/marketing/templates', 'label' => 'Email Templates'],
                    ['path' => '/marketing/whatsapp-templates', 'label' => 'WhatsApp Templates'],
                    ['path' => '/marketing/campaigns', 'label' => 'Campaigns'],
                    ['path' => '/marketing/landing-pages', 'label' => 'Landing Pages'],
                ],
            ],
            [
                'label' => 'Settings',
                'icon' => 'Settings',
                'submenu' => [
                    ['path' => '/settings', 'label' => 'Settings'],
                    ['path' => '/settings/whatsapp', 'label' => 'WhatsApp Integration'],
                    ['path' => '/settings/mail', 'label' => 'Email Integration'],
                    ['path' => '/email-templates', 'label' => 'Email Templates'],
                    ['path' => '/settings/terms-conditions', 'label' => 'Terms & Conditions'],
                    ['path' => '/settings/policies', 'label' => 'Policies'],
                    ['path' => '/settings/account-details', 'label' => 'Account Details'],
                    ['path' => '/settings/logo', 'label' => 'Logo'],
                ],
            ],
            [
                'label' => 'Masters',
                'icon' => 'Grid',
                'submenu' => [
                    ['path' => '/masters/suppliers', 'label' => 'Suppliers'],
                    ['path' => '/masters/hotel', 'label' => 'Hotel'],
                    ['path' => '/masters/activity', 'label' => 'Activity'],
                    ['path' => '/masters/transfer', 'label' => 'Transfer'],
                    ['path' => '/masters/day-itinerary', 'label' => 'Day Itinerary'],
                    ['path' => '/masters/destinations', 'label' => 'Destinations'],
                    ['path' => '/masters/room-type', 'label' => 'Room Type'],
                    ['path' => '/masters/meal-plan', 'label' => 'Meal Plan'],
                    ['path' => '/masters/lead-source', 'label' => 'Lead Source'],
                    ['path' => '/masters/expense-type', 'label' => 'Expense Type'],
                    ['path' => '/masters/package-theme', 'label' => 'Package Theme'],
                    ['path' => '/masters/currency', 'label' => 'Currency'],
                    ['path' => '/users', 'label' => 'Users'],
                    ['path' => '/targets', 'label' => 'Targets'],
                    ['path' => '/permissions', 'label' => 'Permissions'],
                ],
            ],
        ];
    }

    /**
     * Get sidebar menu (tenant-scoped: company_X_sidebar_menu, or global sidebar_menu, or default).
     */
    public function index(): JsonResponse
    {
        try {
            $tenantId = null;
            if (function_exists('tenant')) {
                try {
                    $tenantId = tenant('id');
                } catch (\Throwable $e) {
                    // tenant() not available or failed
                }
            }
            $key = $tenantId ? 'company_' . $tenantId . '_sidebar_menu' : 'sidebar_menu';
            $setting = Setting::where('key', $key)->first();
            $menu = $setting && !empty($setting->value)
                ? json_decode($setting->value, true)
                : MenuController::getDefaultMenu();

            if (!is_array($menu)) {
                $menu = MenuController::getDefaultMenu();
            }

            return response()->json([
                'success' => true,
                'data' => $menu,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'data' => MenuController::getDefaultMenu(),
            ]);
        }
    }

    /**
     * Update sidebar menu (store in settings, tenant-scoped when tenant exists).
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'menu' => 'required|array',
            ]);

            $menu = $request->input('menu');
            $tenantId = function_exists('tenant') ? tenant('id') : null;
            $key = $tenantId ? 'company_' . $tenantId . '_sidebar_menu' : 'sidebar_menu';

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => json_encode($menu),
                    'type' => 'text',
                    'description' => 'Sidebar navigation menu (JSON)',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Menu updated successfully',
                'data' => $menu,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update menu',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
