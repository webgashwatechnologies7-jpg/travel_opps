<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $tickets = Ticket::where('company_id', $user->company_id)
            ->with(['user:id,name'])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->where('is_read', false)
                        ->whereHas('user', function ($q) {
                            $q->where('is_super_admin', true);
                        });
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tickets
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'required|string',
            'subject' => 'nullable|string|max:255',
            'screenshot' => 'nullable|image|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $screenshotPath = null;

        if ($request->hasFile('screenshot')) {
            $screenshotPath = $request->file('screenshot')->store('support_tickets', 'public');
        }

        $ticket = Ticket::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'subject' => $request->subject,
            'description' => $request->description,
            'screenshot' => $screenshotPath,
            'status' => 'pending',
        ]);

        // Notify Super Admins
        $superAdmins = User::where('is_super_admin', true)->get();
        foreach ($superAdmins as $admin) {
            $this->sendNotification(
                $admin->id,
                'New Support Ticket',
                "New ticket from {$user->company->name} by {$user->name}",
                "/super-admin/tickets/{$ticket->id}"
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket submitted successfully',
            'data' => $ticket
        ]);
    }

    public function show($id)
    {
        $user = Auth::user();
        $ticket = Ticket::where('id', $id)
            ->where('company_id', $user->company_id)
            ->with(['user:id,name', 'messages.user:id,name,is_super_admin', 'messages.parentMessage.user:id,name'])
            ->firstOrFail();

        // Mark messages from super admin as read
        TicketMessage::where('ticket_id', $id)
            ->where('is_read', false)
            ->whereHas('user', function ($q) {
                $q->where('is_super_admin', true);
            })
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => $ticket
        ]);
    }

    public function sendMessage(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'attachment' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
            'parent_id' => 'nullable|exists:ticket_messages,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $ticket = Ticket::where('id', $id)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('support_attachments', 'public');
        }

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $request->message,
            'attachment' => $attachmentPath,
            'parent_id' => $request->parent_id,
        ]);

        // Notify Super Admins
        $superAdmins = User::where('is_super_admin', true)->get();
        foreach ($superAdmins as $admin) {
            $this->sendNotification(
                $admin->id,
                'New Message on Ticket',
                "New message from {$user->company->name} on Ticket #{$ticket->id}",
                "/super-admin/tickets/{$ticket->id}"
            );
        }

        return response()->json([
            'success' => true,
            'data' => $message->load(['user:id,name', 'parentMessage.user:id,name'])
        ]);
    }

    private function sendNotification($userId, $title, $message, $url = null)
    {
        // Check if DB notification table exists (from migrations it seems the table is 'notifications' with UUID)
        try {
            \Illuminate\Support\Facades\DB::table('notifications')->insert([
                'id' => Str::uuid(),
                'type' => 'App\Notifications\TicketNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $userId,
                'data' => json_encode([
                    'title' => $title,
                    'message' => $message,
                    'action_url' => $url,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to send notification: " . $e->getMessage());
        }
    }
}
