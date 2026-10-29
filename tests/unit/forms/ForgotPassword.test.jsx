import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), insert: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../src/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, resetPasswordForEmail: mocks.reset, updateUser: mocks.update }, from: () => ({ insert: mocks.insert }) } }));
beforeEach(() => { Object.values(mocks).forEach(m => m.mockReset()); mocks.signIn.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.signUp.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.insert.mockResolvedValue({error:null}); mocks.reset.mockResolvedValue({error:null}); mocks.update.mockResolvedValue({error:null}); });
import ForgotPassword from '../../../src/features/auth/pages/ForgotPassword';
const fill=()=>fireEvent.change(screen.getByPlaceholderText('Correo electrónico'),{target:{value:'user@test.com'}});
const submit=()=>fireEvent.click(screen.getByRole('button',{name:'Enviar enlace de recuperación'}));
describe('Recuperación de contraseña',()=>{
 it('requiere correo',()=>{render(<ForgotPassword/>);submit();expect(screen.getByText('Ingresa tu correo electrónico.')).toBeInTheDocument()});
 it('solicita enlace de recuperación',async()=>{render(<ForgotPassword/>);fill();submit();await waitFor(()=>expect(mocks.reset).toHaveBeenCalledWith('user@test.com',{redirectTo:`${window.location.origin}/reset-password`}));expect(await screen.findByText(/Te enviamos un enlace/)).toBeInTheDocument()});
 it('muestra error del proveedor',async()=>{mocks.reset.mockResolvedValue({error:{message:'No disponible'}});render(<ForgotPassword/>);fill();submit();expect(await screen.findByText('No disponible')).toBeInTheDocument()});
 it('muestra error de red',async()=>{mocks.reset.mockRejectedValue(new Error('network'));render(<ForgotPassword/>);fill();submit();expect(await screen.findByText('No fue posible enviar el correo de recuperación.')).toBeInTheDocument()});
});
