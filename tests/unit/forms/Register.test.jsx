import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), insert: vi.fn(), reset: vi.fn(), update: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../src/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, resetPasswordForEmail: mocks.reset, updateUser: mocks.update }, from: () => ({ insert: mocks.insert }) } }));
beforeEach(() => { Object.values(mocks).forEach(m => m.mockReset()); mocks.signIn.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.signUp.mockResolvedValue({data:{user:{id:'u1'}},error:null}); mocks.insert.mockResolvedValue({error:null}); mocks.reset.mockResolvedValue({error:null}); mocks.update.mockResolvedValue({error:null}); });
import Register from '../../../src/features/auth/pages/Register';
const fill=(password='pass123',confirmation=password)=>{for(const [placeholder,value] of [['Nombre de usuario','tester'],['Email','user@test.com'],['Contraseña',password],['Confirmar contraseña',confirmation]])fireEvent.change(screen.getByPlaceholderText(placeholder),{target:{value}})};
const submit=()=>fireEvent.click(screen.getByRole('button',{name:'Crear cuenta'}));
describe('Formulario de registro',()=>{
 it('exige todos los campos',()=>{render(<Register/>);submit();expect(screen.getByText('Todos los campos son obligatorios.')).toBeInTheDocument()});
 it('rechaza contraseñas diferentes',()=>{render(<Register/>);fill('pass123','different');submit();expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()});
 it('rechaza contraseñas cortas',()=>{render(<Register/>);fill('123');submit();expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument()});
 it('registra usuario y perfil',async()=>{render(<Register/>);fill();submit();await waitFor(()=>expect(mocks.signUp).toHaveBeenCalledWith({email:'user@test.com',password:'pass123'}));await waitFor(()=>expect(mocks.insert).toHaveBeenCalledWith({id:'u1',username:'tester'}));expect(await screen.findByText('Cuenta creada correctamente.')).toBeInTheDocument()});
 it('muestra error del proveedor',async()=>{mocks.signUp.mockResolvedValue({data:{user:null},error:{message:'Ya existe'}});render(<Register/>);fill();submit();expect(await screen.findByText('Ya existe')).toBeInTheDocument()});
 it('muestra error al guardar perfil',async()=>{mocks.insert.mockResolvedValue({error:{message:'error'}});render(<Register/>);fill();submit();expect(await screen.findByText('El usuario fue creado, pero no se pudo guardar el perfil.')).toBeInTheDocument()});
});
