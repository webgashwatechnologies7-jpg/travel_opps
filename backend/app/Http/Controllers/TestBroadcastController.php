<?php

namespace App\Http\Controllers;

use App\Events\WhatsAppWebUpdate;
use Illuminate\Http\Request;

class TestBroadcastController extends Controller
{
    public function test(Request $request)
    {
        $companyId = $request->query('company_id', 1);

        event(new WhatsAppWebUpdate('whatsapp.message', [
            'message' => 'Real-time Test Message from Server ' . now(),
            'sender_name' => 'System Test'
        ], $companyId));

        return response()->json([
            'success' => true,
            'message' => 'Event broadcasted to company ' . $companyId
        ]);
    }
}
