"use client";

import { LogOut, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { logout } from "../app/logout/actions";

export function SessionMenu() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="session-button" onClick={() => setOpen(true)} aria-haspopup="dialog"><span className="avatar">R</span><span><strong>Secure session</strong><small>Account controls</small></span></button>
    {open ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="dialog-close" aria-label="Close logout dialog" onClick={() => setOpen(false)}><X size={16}/></button><span className="dialog-icon"><ShieldCheck size={19}/></span><h2 id="logout-title">End this session?</h2><p>Sign out now to switch accounts and test the reporter or agent workflow.</p><div className="dialog-actions"><button className="button ghost" type="button" onClick={() => setOpen(false)}>Cancel</button><form action={logout}><button className="button logout-button" type="submit"><LogOut size={14}/> Log out</button></form></div></section></div> : null}
  </>;
}
