import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - 404 log güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, redirect_to, notes } = await request.json();

    const client = await pool.connect();

    // Güncelleme sorgusu
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (redirect_to !== undefined) {
      updateFields.push(`redirect_to = $${paramIndex++}`);
      values.push(redirect_to);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (updateFields.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    const query = `
      UPDATE not_found_logs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);
    client.release();

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '404 log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating 404 log:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update 404 log' },
      { status: 500 }
    );
  }
}

// DELETE - 404 log sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await pool.connect();
    const result = await client.query('DELETE FROM not_found_logs WHERE id = $1', [id]);
    client.release();

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '404 log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '404 log deleted' });
  } catch (error) {
    console.error('Error deleting 404 log:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete 404 log' },
      { status: 500 }
    );
  }
}

