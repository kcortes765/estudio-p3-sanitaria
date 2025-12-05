import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gauucdpgnrxduvhacoes.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdXVjZHBnbnJ4ZHV2aGFjb2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjMwMDEsImV4cCI6MjA4MDUzOTAwMX0.ZN0E_4IiB7fCXvTq2NZm15PLFzSMmp9PnA_Aj-WDaJc';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============ QUESTION SETS ============

export async function loadQuestionSets() {
    const { data, error } = await supabase
        .from('question_sets')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading question sets:', error);
        return [];
    }
    return data || [];
}

export async function loadQuestionSet(id) {
    const { data, error } = await supabase
        .from('question_sets')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error loading question set:', error);
        return null;
    }
    return data;
}

export async function saveQuestionSet(id, name, questions) {
    const { data, error } = await supabase
        .from('question_sets')
        .upsert({ id, name, questions }, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving question set:', error);
        return null;
    }
    return data;
}

export async function deleteQuestionSet(id) {
    // Also delete progress for this set
    await supabase.from('progress').delete().eq('filename', id);

    const { error } = await supabase
        .from('question_sets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting question set:', error);
        return false;
    }
    return true;
}

// ============ PROGRESS ============

export async function loadProgress(filename) {
    const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('filename', filename);

    if (error) {
        console.error('Error loading progress:', error);
        return {};
    }

    const progressObj = {};
    data?.forEach(item => {
        progressObj[item.question_id] = {
            veces_mostrada: item.veces_mostrada,
            ultima_confianza: item.ultima_confianza,
            confianza_sum: item.confianza_sum,
            confianza_count: item.confianza_count,
            confianza_promedio: item.confianza_promedio,
            ultima_fecha_vista: item.ultima_fecha_vista,
            marcada_para_repaso: item.marcada_para_repaso
        };
    });

    return progressObj;
}

export async function updateProgress(filename, questionId, updates) {
    const { data: existing } = await supabase
        .from('progress')
        .select('*')
        .eq('filename', filename)
        .eq('question_id', questionId)
        .single();

    let record = existing || {
        filename,
        question_id: questionId,
        veces_mostrada: 0,
        ultima_confianza: null,
        confianza_sum: 0,
        confianza_count: 0,
        confianza_promedio: null,
        ultima_fecha_vista: null,
        marcada_para_repaso: false
    };

    if (updates.confidence !== undefined) {
        record.veces_mostrada += 1;
        record.ultima_confianza = updates.confidence;
        record.confianza_sum += updates.confidence;
        record.confianza_count += 1;
        record.confianza_promedio = Math.round((record.confianza_sum / record.confianza_count) * 100) / 100;
    }

    if (updates.marked !== undefined) {
        record.marcada_para_repaso = updates.marked;
    }

    record.ultima_fecha_vista = new Date().toISOString();

    const { data, error } = await supabase
        .from('progress')
        .upsert(record, { onConflict: 'filename,question_id' })
        .select()
        .single();

    if (error) {
        console.error('Error updating progress:', error);
        return null;
    }

    return {
        veces_mostrada: data.veces_mostrada,
        ultima_confianza: data.ultima_confianza,
        confianza_sum: data.confianza_sum,
        confianza_count: data.confianza_count,
        confianza_promedio: data.confianza_promedio,
        ultima_fecha_vista: data.ultima_fecha_vista,
        marcada_para_repaso: data.marcada_para_repaso
    };
}

export async function resetProgress(filename) {
    const { error } = await supabase
        .from('progress')
        .delete()
        .eq('filename', filename);

    if (error) {
        console.error('Error resetting progress:', error);
        return false;
    }
    return true;
}
