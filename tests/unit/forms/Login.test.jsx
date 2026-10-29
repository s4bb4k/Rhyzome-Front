import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), insert: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../src/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, resetPasswordForEmail: mocks.reset, updateUser: mocks.update }, from: () => ({ insert: mocks.insert }) } }));
beforeEach(() => { Object.values(mocks).forEach(m => m.mockReset()); mocks.signIn.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.signUp.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.insert.mockResolvedValue({error:null}); mocks.reset.mockResolvedValue({error:null}); mocks.update.mockResolvedValue({error:null}); });
import Login from '../../../src/features/auth/pages/Login';
const fill=()=>{fireEvent.change(screen.getByPlaceholderText('Correo electrónico'),{target:{value:'user@test.com'}});fireEvent.change(screen.getByPlaceholderText('Contraseña'),{target:{value:'pass123'}})};
describe('Formulario de inicio de sesión',()=>{
 it('exige correo y contraseña',()=>{render(<Login/>);fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(screen.getByText('Ingresa tu correo electrónico y contraseña.')).toBeInTheDocument();expect(mocks.signIn).not.toHaveBeenCalled()});
 it('envía credenciales válidas a Supabase',async()=>{render(<Login/>);fill();fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));await waitFor(()=>expect(mocks.signIn).toHaveBeenCalledWith({email:'user@test.com',password:'pass123'}));expect(await screen.findByText('Inicio de sesión exitoso.')).toBeInTheDocument()});
 it('informa credenciales incorrectas',async()=>{mocks.signIn.mockResolvedValue({data:{user:null},error:{message:'invalid'}});render(<Login/>);fill();fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(await screen.findByText('Correo electrónico o contraseña incorrectos.')).toBeInTheDocument()});
 it('informa fallos inesperados',async()=>{mocks.signIn.mockRejectedValue(new Error('network'));render(<Login/>);fill();fireEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(await screen.findByText('Ocurrió un error al iniciar sesión.')).toBeInTheDocument()});
});
