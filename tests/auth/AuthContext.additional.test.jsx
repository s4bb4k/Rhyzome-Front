import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,waitFor,fireEvent} from '@testing-library/react';
const mock=vi.hoisted(()=>({getUser:vi.fn(),getSession:vi.fn(),unsubscribe:vi.fn(),callback:null}));
vi.mock('../../src/lib/supabase',()=>({supabase:{auth:{getUser:mock.getUser,getSession:mock.getSession,onAuthStateChange:(cb)=>{mock.callback=cb;return {data:{subscription:{unsubscribe:mock.unsubscribe}}};}}}}));
import {AuthProvider,useAuth} from '../../src/features/auth/context/AuthContext';
function State(){const {session,loading}=useAuth();return <div>{loading?'cargando':session?'autenticado':'sin sesión'}</div>}
beforeEach(()=>{mock.getUser.mockReset();mock.getSession.mockReset();mock.unsubscribe.mockClear();mock.getUser.mockResolvedValue({data:{user:{id:'1',email:'test@example.com'}},error:null});mock.getSession.mockResolvedValue({data:{session:{user:{id:'1'},expires_at:Math.floor(Date.now()/1000)+3600}},error:null});});
afterEach(()=>vi.restoreAllMocks());
describe('Autenticación: escenarios de error y ciclo de vida',()=>{
 it('rechaza errores al validar usuario',async()=>{mock.getUser.mockResolvedValue({data:{user:null},error:{message:'sin sesión'}});render(<AuthProvider><State/></AuthProvider>);await screen.findByText('sin sesión');});
 it('rechaza sesión no disponible',async()=>{mock.getSession.mockResolvedValue({data:{session:null},error:null});render(<AuthProvider><State/></AuthProvider>);await screen.findByText('sin sesión');});
 it('rechaza errores al obtener sesión',async()=>{mock.getSession.mockResolvedValue({data:{session:null},error:{message:'expirada'}});render(<AuthProvider><State/></AuthProvider>);await screen.findByText('sin sesión');});
 it('maneja excepciones de Supabase',async()=>{const spy=vi.spyOn(console,'error').mockImplementation(()=>{});mock.getUser.mockRejectedValue(new Error('red'));render(<AuthProvider><State/></AuthProvider>);await screen.findByText('sin sesión');expect(spy).toHaveBeenCalled();});
 it('revalida sesión al recuperar el foco',async()=>{render(<AuthProvider><State/></AuthProvider>);await screen.findByText('autenticado');fireEvent.focus(window);await waitFor(()=>expect(mock.getUser).toHaveBeenCalledTimes(2));});
 it('desuscribe eventos al desmontar el proveedor',async()=>{const {unmount}=render(<AuthProvider><State/></AuthProvider>);await screen.findByText('autenticado');unmount();expect(mock.unsubscribe).toHaveBeenCalledOnce();});
 it('impide usar el contexto fuera del proveedor',()=>{const spy=vi.spyOn(console,'error').mockImplementation(()=>{});expect(()=>render(<State/>)).toThrow('useAuth debe utilizarse dentro de AuthProvider');spy.mockRestore();});
});
