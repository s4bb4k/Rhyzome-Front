import React from "react";
import { describe,it,expect,vi } from 'vitest';
import { render,screen } from '@testing-library/react';
import { MemoryRouter,Routes,Route } from 'react-router-dom';
vi.mock('../../src/features/auth/context/AuthContext',()=>({useAuth:vi.fn()}));
import {useAuth} from '../../src/features/auth/context/AuthContext';
import ProtectedRoute from '../../src/features/auth/components/ProtectedRoute';
const renderRoute=()=>render(<MemoryRouter initialEntries={['/dashboard']}><Routes><Route path="/" element={<div>Login público</div>}/><Route element={<ProtectedRoute/>}><Route path="/dashboard" element={<div>Dashboard privado</div>}/></Route></Routes></MemoryRouter>);
describe('Protección de rutas',()=>{
 it('redirige a login sin sesión',()=>{useAuth.mockReturnValue({session:null,loading:false});renderRoute();expect(screen.getByText('Login público')).toBeInTheDocument();});
 it('permite acceso con sesión',()=>{useAuth.mockReturnValue({session:{user:{id:'u1'}},loading:false});renderRoute();expect(screen.getByText('Dashboard privado')).toBeInTheDocument();});
 it('espera validación inicial',()=>{useAuth.mockReturnValue({session:null,loading:true});renderRoute();expect(screen.getByText('Validando sesión...')).toBeInTheDocument();});
});
