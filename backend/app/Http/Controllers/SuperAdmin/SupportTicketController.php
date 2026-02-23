<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SupportTicketController extends Controller
{
    public function index()
    {
        $tickets = Ticket::with(['company:id,name', 'user:id,name'])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->where('is_read', false)
                        ->whereHas('user', function ($q) {
                            $q->where('is_super_admin', false);
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

    public function show($id)
    {
        $ticket = Ticket::with(['company:id,name', 'user:id,name', 'messages.user:id,name,is_super_admin', 'messages.parentMessage.user:id,name'])
            ->findOrFail($id);

        // Mark messages from company as read
        TicketMessage::where('ticket_id', $id)
            ->where('is_read', false)
            ->whereHas('user', function ($q) {
                $q->where('is_super_admin', false);
            })
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => $ticket
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,on working,done',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Invalid status'], 422);
        }

        $ticket = Ticket::findOrFail($id);
        $oldStatus = $ticket->status;
        $ticket->status = $request->status;
        $ticket->save();

        // Notify Company Admin & Manager
        if ($oldStatus !== $ticket->status) {
            $this->notifyCompany($ticket);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
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

        $ticket = Ticket::findOrFail($id);
        $user = Auth::user();

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

        // Notify Company Admin & Manager
        $this->notifyCompany($ticket, 'New Reply on Support Ticket', "Super Admin replied to your ticket #{$ticket->id}");

        return response()->json([
            'success' => true,
            'data' => $message->load(['user:id,name', 'parentMessage.user:id,name'])
        ]);
    }

    private function notifyCompany($ticket, $title = null, $message = null)
    {
        $companyId = $ticket->company_id;

        // Find Admins and Managers of this company
        $usersToNotify = User::where('company_id', $companyId)
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['Admin', 'Company Admin', 'Manager']);
            })->get();

        if ($title === null) {
            $title = "Ticket Status Updated";
            $message = "Your ticket #{$ticket->id} status is now: " . strtoupper($ticket->status);

            if ($ticket->status === 'done') {
                $message = "Your ticket #{$ticket->id} is solved. Check and contact if issue persists.";

                // Send Email to company users
                foreach ($usersToNotify as $user) {
                    $this->sendEmail($user, $ticket);
                }
            }
        }

        foreach ($usersToNotify as $user) {
            $this->sendNotification($user->id, $title, $message, "/support/tickets/{$ticket->id}");
        }
    }

    private function sendEmail($user, $ticket)
    {
        try {
            $data = [
                'user_name' => $user->name,
                'ticket_id' => $ticket->id,
                'status' => $ticket->status
            ];

            Mail::send([], [], function ($message) use ($user, $ticket) {
                $message->to($user->email)
                    ->subject("Support Ticket Solved - #{$ticket->id}")
                    ->html("
                        <h2>Hello {$user->name},</h2>
                        <p>Your support ticket <b>#{$ticket->id}</b> has been marked as <b>SOLVED</b>.</p>
                        <p>You can check the resolution in your dashboard. If you still face any issues, feel free to contact us.</p>
                        <p>Thank you,<br>Support Team</p>
                    ");
            });
        } catch (\Exception $e) {
            \Log::error("Failed to send ticket email: " . $e->getMessage());
        }
    }

    private function sendNotification($userId, $title, $message, $url = null)
    {
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
