<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            ['path' => '/leads', 'label' => 'Queries', 'icon' => 'MessageSquare'],
            ['path' => '/itineraries', 'label' => 'Itineraries', 'icon' => 'FileText'],
            ['path' => '/notifications', 'label' => 'Notifications', 'icon' => 'Bell'],
            ['path' => '/sales-reps', 'label' => 'Sales Reps', 'icon' => 'Users'],
            ['path' => '/payments', 'label' => 'Payments', 'icon' => 'CreditCard'],
            [
                'label' => 'Accounts',
                'icon' => 'CreditCard',
                'submenu' => [
                    ['path' => '/accounts/clients', 'label' => 'Clients'],
                    ['path' => '/accounts/agents', 'label' => 'Agents'],
                    ['path' => '/accounts/corporate', 'label' => 'Corporate'],
                ],
            ],
            ['path' => '/whatsapp-web', 'label' => 'WhatsApp', 'icon' => 'MessageCircle'],
            ['path' => '/mail', 'label' => 'All Mails', 'icon' => 'Mail'],
            [
                'label' => 'Integrate',
                'icon' => 'Link2',
                'submenu' => [
                    ['path' => '/settings/mail', 'label' => 'Email Integration'],
                    ['path' => '/settings/whatsapp', 'label' => 'WhatsApp Integration'],
                    ['path' => '/settings/telephony', 'label' => 'Telephony Integration'],
                ],
            ],
            ['path' => '/call-management', 'label' => 'Call Management System', 'icon' => 'Phone'],
            ['path' => '/followups', 'label' => 'Followups', 'icon' => 'ClipboardList'],
            [
                'label' => 'Staff Management',
                'icon' => 'Users',
                'submenu' => [
                    ['path' => '/staff-management/dashboard', 'label' => 'Dashboard'],
                    ['path' => '/staff-management/users', 'label' => 'All Users'],
                    ['path' => '/staff-management/teams', 'label' => 'All Team'],
                    ['path' => '/staff-management/roles', 'label' => 'All Role'],
                    ['path' => '/staff-management/branches', 'label' => 'All Branch'],
                ],
            ],
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
                'label' => 'Company Settings',
                'icon' => 'Settings',
                'submenu' => [
                    ['path' => '/settings/whatsapp', 'label' => 'WhatsApp Integration'],
                    ['path' => '/settings/mail', 'label' => 'Email Integration'],
                    ['path' => '/settings/telephony', 'label' => 'Telephony Integration'],
                    ['path' => '/settings/account-details', 'label' => 'Account Details'],
                ],
            ],
            [
                'label' => 'Masters',
                'icon' => 'Grid',
                'submenu' => [
                    ['path' => '/masters/suppliers', 'label' => 'Suppliers'],
                    ['path' => '/masters/hotel', 'label' => 'Hotel'],
                    ['path' => '/masters/activity', 'label' => 'Activity'],
                    ['path' => '/masters/transfer', 'label' => 'Transport'],
                    ['path' => '/masters/day-itinerary', 'label' => 'Day Itinerary'],
                    ['path' => '/masters/destinations', 'label' => 'Destinations'],
                    ['path' => '/masters/room-type', 'label' => 'Room Type'],
                    ['path' => '/masters/meal-plan', 'label' => 'Meal Plan'],
                    ['path' => '/masters/lead-source', 'label' => 'Lead Source'],
                    ['path' => '/masters/expense-type', 'label' => 'Expense Type'],
                    ['path' => '/masters/points', 'label' => 'Inclusions & Exclusions'],
                    ['path' => '/targets', 'label' => 'Targets'],
                ],
            ],
            ['path' => '/support', 'label' => 'Customer Support', 'icon' => 'MessageSquare'],
        ];
    }

    /**
     * Get sidebar menu (tenant-scoped: company_X_sidebar_menu, or global sidebar_menu, or default).
     */
    public function index(): JsonResponse
    {
        try {
            $tenantId = Auth::user() ? Auth::user()->company_id : null;
            $key = $tenantId ? 'company_' . $tenantId . '_sidebar_menu' : 'sidebar_menu';
            $cacheKey = "menu_cache_{$key}";

            $menu = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(24), function () use ($key) {
                $setting = Setting::where('key', $key)->first();
                $menuData = $setting && !empty($setting->value)
                    ? json_decode($setting->value, true)
                    : MenuController::getDefaultMenu();

                return is_array($menuData) ? $menuData : MenuController::getDefaultMenu();
            });

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
            $tenantId = Auth::user() ? Auth::user()->company_id : null;
            $key = $tenantId ? 'company_' . $tenantId . '_sidebar_menu' : 'sidebar_menu';

            // Clear cache
            \Illuminate\Support\Facades\Cache::forget("menu_cache_{$key}");

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
