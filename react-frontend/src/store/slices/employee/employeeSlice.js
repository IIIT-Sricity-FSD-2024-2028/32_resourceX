import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as employeeService from '../../../services/employee';

/**
 * Platform Employee Async Thunks
 * Assigned to: Person 6
 */
export const fetchEmployeeInstitutions = createAsyncThunk('employee/fetchInstitutions', async (employeeId, { rejectWithValue }) => {
  try {
    return await employeeService.fetchEmployeeInstitutions(employeeId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchEmployeeTickets = createAsyncThunk('employee/fetchTickets', async (_, { rejectWithValue }) => {
  try {
    return await employeeService.fetchEmployeeTickets();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    institutions: [],
    tickets: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeInstitutions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployeeInstitutions.fulfilled, (state, action) => {
        state.loading = false;
        state.institutions = action.payload || [];
      })
      .addCase(fetchEmployeeInstitutions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployeeTickets.fulfilled, (state, action) => {
        state.tickets = action.payload || [];
      });
  },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
