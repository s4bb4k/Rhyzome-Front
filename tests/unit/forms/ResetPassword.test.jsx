import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), insert: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../src/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, resetPasswordForEmail: mocks.reset, updateUser: mocks.update }, from: () => ({ insert: mocks.insert }) } }));
beforeEach(() => { Object.values(mocks).forEach(m => m.mockReset()); mocks.signIn.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.signUp.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.insert.mockResolvedValue({error:null}); mocks.reset.mockResolvedValue({error:null}); mocks.update.mockResolvedValue({error:null}); });
import ResetPassword from '../../../src/features/auth/pages/ResetPassword';
const fill=(password,confirm=password)=>{fireEvent.change(screen.getByPlaceholderText('Nueva contraseña'),{target:{value:password}});fireEvent.change(screen.getByPlaceholderText('Confirmar nueva contraseña'),{target:{value:confirm}})};
const submit=()=>fireEvent.click(screen.getByRole('button',{name:'Actualizar contraseña'}));
describe('Restablecimiento de contraseña',()=>{
 it('exige ambos campos',()=>{render(<ResetPassword/>);submit();expect(screen.getByText('Completa ambos campos.')).toBeInTheDocument()});
 it('exige longitud mínima',()=>{render(<ResetPassword/>);fill('123');submit();expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument()});
 it('exige coincidencia',()=>{render(<ResetPassword/>);fill('pass123','pass456');submit();expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()});
 it('actualiza contraseña',async()=>{render(<ResetPassword/>);fill('pass123');submit();await waitFor(()=>expect(mocks.update).toHaveBeenCalledWith({password:'pass123'}));expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument()});
 it('muestra error de actualización',async()=>{mocks.update.mockResolvedValue({error:{message:'Enlace vencido'}});render(<ResetPassword/>);fill('pass123');submit();expect(await screen.findByText('Enlace vencido')).toBeInTheDocument()});
});
