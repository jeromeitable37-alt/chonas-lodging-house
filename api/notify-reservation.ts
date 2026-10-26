import { createClient } from '@supabase/supabase-js';

const env = (globalThis as any).process?.env || {};
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] as string));

function emailShell(title: string, intro: string, booking: any, roomImage: string, siteUrl: string) {
  const dateText = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const nights = Math.max(0, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000));
  const total = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(booking.total || 0));
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f2f4ef;font-family:Arial,Helvetica,sans-serif;color:#304438">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f4ef;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fffefa;border:1px solid #e5e9e0;border-radius:12px;overflow:hidden">
<tr><td style="background:#203f35;padding:22px 28px;color:#fff">
<div style="font-size:23px;font-family:Georgia,serif;font-weight:bold">Chona’s Lodging House</div>
<div style="font-size:10px;letter-spacing:2px;margin-top:5px;color:#dce6d8">LODGING &amp; RESERVATIONS</div>
</td></tr>
<tr><td style="padding:28px">
<p style="font-size:10px;font-weight:bold;letter-spacing:1.8px;color:#a48651;margin:0 0 12px">RESERVATION UPDATE</p>
<h1 style="font-family:Georgia,serif;font-size:29px;font-weight:normal;line-height:1.2;margin:0 0 12px;color:#294639">${escapeHtml(title)}</h1>
<p style="font-size:14px;line-height:1.7;color:#6f7d72;margin:0 0 22px">${escapeHtml(intro)}</p>
<div style="border:1px dashed #cbd8c5;border-radius:8px;background:#f4f7f0;padding:15px 17px;margin-bottom:22px">
<div style="font-size:10px;letter-spacing:1.4px;color:#7f8d80;font-weight:bold">RESERVATION REFERENCE</div>
<div style="font-size:25px;letter-spacing:1px;font-family:Georgia,serif;color:#315b43;margin-top:6px">${escapeHtml(booking.reference)}</div>
</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td width="42%" valign="top" style="padding:0 14px 12px 0">${roomImage ? `<img src="${escapeHtml(roomImage)}" alt="" width="220" style="width:100%;max-width:220px;height:auto;display:block;border-radius:6px">` : ''}</td>
<td valign="top" style="padding-bottom:12px">
<div style="font-size:18px;font-family:Georgia,serif;color:#2e4939;margin-bottom:7px">${escapeHtml(booking.room_name)}</div>
<div style="font-size:12px;color:#7b877c;line-height:1.8">${escapeHtml(booking.guests)} guest(s)<br>${nights} night(s)<br>${escapeHtml(booking.status)}</div>
</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eaede6;margin-top:12px">
<tr><td style="padding:13px 0;font-size:12px;color:#7c897e">Check-in</td><td align="right" style="padding:13px 0;font-size:12px;font-weight:bold;color:#354f3c">${dateText(booking.check_in)}</td></tr>
<tr><td style="padding:13px 0;font-size:12px;color:#7c897e;border-top:1px solid #f0f1ed">Check-out</td><td align="right" style="padding:13px 0;font-size:12px;font-weight:bold;color:#354f3c;border-top:1px solid #f0f1ed">${dateText(booking.check_out)}</td></tr>
<tr><td style="padding:14px 0;border-top:1px solid #e3e9df;font-size:12px;font-weight:bold;color:#435b48">Estimated total</td><td align="right" style="padding:14px 0;border-top:1px solid #e3e9df;font-family:Georgia,serif;font-size:21px;font-weight:bold;color:#315b43">${total}</td></tr>
</table>
<div style="margin-top:20px;text-align:center"><a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#2d5748;border-radius:5px;padding:13px 20px;color:#fff;text-decoration:none;font-size:12px;font-weight:bold">View Chona’s Lodging House</a></div>
<p style="font-size:11px;line-height:1.7;color:#89938a;margin:24px 0 0">A reservation request is not confirmed until the lodging staff updates its status. Please keep your reference number for inquiries.</p>
</td></tr>
<tr><td style="padding:15px 28px;background:#f8f9f5;border-top:1px solid #eaede6;color:#89938a;font-size:10px">Chona’s Lodging House · Comfort, care, and a little peace of mind.</td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req: any, res: any) {
  const allowedOrigins = new Set([
    'https://chonas-lodging-house-e1qx.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  const appsScriptUrl = env.APPS_SCRIPT_URL;
  const appsScriptSecret = env.APPS_SCRIPT_WEBHOOK_SECRET;
  if (!supabaseUrl || !anonKey || !serviceKey || !appsScriptUrl || !appsScriptSecret) {
    return res.status(200).json({ configured: false, guestSent: false, staffSent: false, reason: 'Email sending is not fully configured.' });
  }

  const authorization = typeof req.headers?.authorization === 'string' ? req.headers.authorization : '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ configured: true, guestSent: false, staffSent: false, error: 'Sign-in required.' });

  try {
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return res.status(401).json({ configured: true, guestSent: false, staffSent: false, error: 'Invalid session.' });

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const event = body.event;
    const bookingId = String(body.bookingId || '');
    if (!['booking_created', 'status_updated'].includes(event) || !/^[0-9a-f-]{36}$/i.test(bookingId)) {
      return res.status(400).json({ configured: true, guestSent: false, staffSent: false, error: 'Invalid notification request.' });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const [{ data: profile }, { data: booking, error: bookingError }] = await Promise.all([
      adminClient.from('profiles').select('role').eq('id', userData.user.id).maybeSingle(),
      adminClient.from('bookings').select('id,reference,user_id,room_id,room_name,guest_name,email,phone,check_in,check_out,guests,total,status,created_at').eq('id', bookingId).maybeSingle(),
    ]);
    if (bookingError || !booking) return res.status(404).json({ configured: true, guestSent: false, staffSent: false, error: 'Reservation not found.' });
    const isAdmin = profile?.role === 'admin';
    if (event === 'booking_created' && booking.user_id !== userData.user.id) {
      return res.status(403).json({ configured: true, guestSent: false, staffSent: false, error: 'Not allowed to notify this reservation.' });
    }
    if (event === 'status_updated' && !isAdmin) {
      return res.status(403).json({ configured: true, guestSent: false, staffSent: false, error: 'Admin access required.' });
    }

    const { data: room } = await adminClient.from('rooms').select('image_url').eq('id', booking.room_id).maybeSingle();
    const siteUrl = 'https://chonas-lodging-house-e1qx.vercel.app';
    const statusLabel = String(booking.status);
    const guestTitle = event === 'booking_created'
      ? 'We received your reservation request'
      : statusLabel === 'Confirmed'
        ? 'Your reservation is confirmed'
        : statusLabel === 'Cancelled'
          ? 'Your reservation has been cancelled'
          : 'Your reservation status has been updated';
    const guestIntro = event === 'booking_created'
      ? 'Thank you for choosing Chona’s Lodging House. Your request has been saved and is waiting for staff confirmation.'
      : statusLabel === 'Confirmed'
        ? 'Great news — the lodging staff confirmed your reservation. Please keep the reference below for check-in.'
        : statusLabel === 'Cancelled'
          ? 'The reservation status was changed to cancelled. If you believe this is a mistake, contact the lodging house and share your reference.'
          : `The current status of your reservation is now ${statusLabel}. Keep your reference number for any questions.`;
    const statusPart = statusLabel.toLowerCase().replace(/\s+/g, '_');
    const guestEventKey = event === 'booking_created' ? 'booking_created_guest' : 'status_' + statusPart + '_guest';

    async function sendTrackedEmail(recipient: string, eventKey: string, subject: string, html: string): Promise<boolean> {
      const email = recipient.trim().toLowerCase();
      if (!email) return false;
      const { data: existing, error: lookupError } = await adminClient.from('email_delivery_logs')
        .select('id,status').eq('booking_id', booking.id).eq('event_key', eventKey).eq('recipient', email).maybeSingle();
      if (lookupError) {
        console.error('Email delivery log lookup failed:', lookupError.message);
        return false;
      }
      if (existing?.status === 'sent') return true;
      let logId: number | null = existing?.id ?? null;
      if (logId) {
        const { error } = await adminClient.from('email_delivery_logs').update({ status: 'pending', error_message: null }).eq('id', logId);
        if (error) console.error('Email log update failed:', error.message);
      } else {
        const { data: logRow, error } = await adminClient.from('email_delivery_logs')
          .insert({ booking_id: booking.id, event_key: eventKey, recipient: email, status: 'pending' })
          .select('id').single();
        if (error || !logRow) {
          console.error('Email log insert failed:', error?.message);
          return false;
        }
        logId = Number(logRow.id);
      }
      let providerData: any = {};
      try {
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: appsScriptSecret,
            event: event === 'booking_created' ? 'reservation_created' : 'reservation_status_changed',
            booking: {
              guestEmail: email,
              guestName: booking.guest_name,
              reference: booking.reference,
              roomName: booking.room_name,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              guests: booking.guests,
              total: booking.total,
              status: booking.status,
            },
          }),
        });
        providerData = await response.json().catch(() => ({}));
        if (!response.ok || providerData?.success !== true) {
          const safeError = String(providerData?.error || 'Apps Script rejected the email request.').slice(0, 400);
          await adminClient.from('email_delivery_logs').update({ status: 'failed', error_message: safeError }).eq('id', logId);
          return false;
        }
      } catch {
        await adminClient.from('email_delivery_logs').update({ status: 'failed', error_message: 'Could not connect to Google Apps Script.' }).eq('id', logId);
        return false;
      }
      const { error: saveError } = await adminClient.from('email_delivery_logs')
        .update({ status: 'sent', provider_id: 'apps-script', sent_at: new Date().toISOString(), error_message: null })
        .eq('id', logId);
      if (saveError) console.error('Could not save email delivery state:', saveError.message);
      return true;
    }

    const guestSubject = event === 'booking_created'
      ? `Reservation request received · ${booking.reference}`
      : `Reservation update · ${booking.reference}`;
    const guestSent = await sendTrackedEmail(String(booking.email), guestEventKey, guestSubject, emailShell(guestTitle, guestIntro, booking, String(room?.image_url || ''), siteUrl));
    const staffEmail = String(env.ADMIN_NOTIFICATION_EMAIL || '').trim().toLowerCase();
    let staffSent = false;
    if (event === 'booking_created' && staffEmail) {
      const staffHtml = emailShell('New reservation request received', `A new guest request is waiting for review. Current status: ${statusLabel}.`, booking, String(room?.image_url || ''), siteUrl);
      staffSent = await sendTrackedEmail(staffEmail, 'booking_created_staff', `New reservation · ${booking.reference}`, staffHtml);
    }
    return res.status(200).json({ configured: true, guestSent, staffSent });
  } catch (error) {
    console.error('Reservation notification failed:', error);
    return res.status(500).json({ configured: true, guestSent: false, staffSent: false, error: 'Unable to process reservation email.' });
  }
}
