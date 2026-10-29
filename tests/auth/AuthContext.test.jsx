import React from "react";
import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,waitFor,act} from '@testing-library/react';
const mock=vi.hoisted(()=>({callback:null,getUser:vi.fn(),getSession:vi.fn(),unsubscribe:vi.fn()}));
vi.mock('../../src/lib/supabase',()=>({supabase:{auth:{getUser:mock.getUser,getSession:mock.getSession,onAuthStateChange:(cb)=>{mock.callback=cb;return {data:{subscription:{unsubscribe:mock.unsubscribe}}};}}}}));
import {AuthProvider,useAuth} from '../../src/features/auth/context/AuthContext';
function State(){const {session,loading}=useAuth();return <div>{loading?'cargando':session?'autenticado':'sin sesión'}</div>}
beforeEach(()=>{mock.getUser.mockReset();mock.getSession.mockReset();mock.getUser.mockResolvedValue({data:{user:{id:'1',email:'demo@example.test'}},error:null});mock.getSession.mockResolvedValue({data:{session:{user:{id:'1'},expires_at:Math.floor(Date.now()/1000)+3600}},error:null});});
describe('Proveedor de autenticación',()=>{
 it('recupera sesión válida al iniciar',async()=>{render(<AuthProvider><State/></AuthProvider>);await waitFor(()=>expect(screen.getByText('autenticado')).toBeInTheDocument());});
 it('rechaza usuario no válido',async()=>{mock.getUser.mockResolvedValue({data:{user:null},error:null});render(<AuthProvider><State/></AuthProvider>);await waitFor(()=>expect(screen.getByText('sin sesión')).toBeInTheDocument());});
 it('responde al cierre de sesión',async()=>{render(<AuthProvider><State/></AuthProvider>);await screen.findByText('autenticado');act(()=>mock.callback('SIGNED_OUT',null));expect(screen.getByText('sin sesión')).toBeInTheDocument();});
 it('acepta renovación de token',async()=>{render(<AuthProvider><State/></AuthProvider>);await screen.findByText('autenticado');act(()=>mock.callback('TOKEN_REFRESHED',{user:{id:'1'},expires_at:Math.floor(Date.now()/1000)+7200}));expect(screen.getByText('autenticado')).toBeInTheDocument();});
});
